import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Get questions that were answered incorrectly in the most recent attempt
        const incorrectAttempts = await prisma.userAttempt.findMany({
            where: {
                userId: userId
            },
            include: {
                question: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Group by questionId and get the latest attempt for each question
        const latestAttempts = new Map();
        incorrectAttempts.forEach(attempt => {
            if (!latestAttempts.has(attempt.questionId)) {
                latestAttempts.set(attempt.questionId, attempt);
            }
        });

        // Filter to only include questions where the latest attempt was incorrect
        const stillIncorrectAttempts = Array.from(latestAttempts.values())
            .filter(attempt => !attempt.isCorrect);

        // Transform the data to include parsed JSON fields
        const transformedAttempts = stillIncorrectAttempts.map(attempt => {
            const selectedAnswers = JSON.parse(attempt.selectedAnswers);

            // Handle empty arrays or invalid data
            if (!Array.isArray(selectedAnswers) || selectedAnswers.length === 0) {
                return {
                    ...attempt,
                    selectedAnswers: [],
                    question: {
                        ...attempt.question,
                        correctAnswers: JSON.parse(attempt.question.correctAnswers),
                        keywords: attempt.question.keywords ? JSON.parse(attempt.question.keywords) : []
                    }
                };
            }

            // Convert 1-based to 0-based, but handle legacy 0-based data
            const convertedAnswers = selectedAnswers.map((answer: number) => {
                // If answer is 0, it's likely legacy 0-based data, keep as is
                // If answer > 0, it's 1-based data, convert to 0-based
                return answer > 0 ? answer - 1 : answer;
            });

            return {
                ...attempt,
                selectedAnswers: convertedAnswers,
                question: {
                    ...attempt.question,
                    correctAnswers: JSON.parse(attempt.question.correctAnswers),
                    keywords: attempt.question.keywords ? JSON.parse(attempt.question.keywords) : []
                }
            };
        });

        return NextResponse.json(transformedAttempts);
    } catch (error) {
        console.error('Error fetching incorrect attempts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch incorrect attempts' },
            { status: 500 }
        );
    }
}


