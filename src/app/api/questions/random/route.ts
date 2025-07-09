import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const requestedCount = parseInt(searchParams.get('count') || '10');

        // Get total count of questions
        const totalQuestions = await prisma.question.count();

        // Ensure we don't request more questions than available
        const count = Math.min(requestedCount, totalQuestions);

        let questions;
        
        if (count >= totalQuestions) {
            // Get all questions and shuffle them
            questions = await prisma.question.findMany({
                orderBy: {
                    id: 'asc'
                }
            });
            // Fisher-Yates shuffle algorithm for better randomness
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        } else {
            // Get all question IDs first
            const allQuestions = await prisma.question.findMany({
                select: { id: true },
                orderBy: { id: 'asc' }
            });

            // Create array of all IDs and shuffle them
            const allIds = allQuestions.map(q => q.id);
            
            // Fisher-Yates shuffle to get truly random selection
            for (let i = allIds.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
            }

            // Take the first 'count' shuffled IDs (guaranteed no duplicates)
            const selectedIds = allIds.slice(0, count);

            // Fetch the actual questions using the randomly selected IDs
            questions = await prisma.question.findMany({
                where: {
                    id: {
                        in: selectedIds
                    }
                },
                orderBy: {
                    id: 'asc'
                }
            });

            // Shuffle the final questions array to randomize the order
            for (let i = questions.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [questions[i], questions[j]] = [questions[j], questions[i]];
            }
        }

        // Transform the questions to include parsed correctAnswers
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
        }));

        return NextResponse.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching random questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
