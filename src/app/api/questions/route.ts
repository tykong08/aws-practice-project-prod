import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const questions = await prisma.question.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Transform the questions to include parsed correctAnswers
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
        }));

        return NextResponse.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching questions:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // If questionIds array is provided, return those specific questions
        if (body.questionIds && Array.isArray(body.questionIds)) {
            const questions = await prisma.question.findMany({
                where: {
                    id: {
                        in: body.questionIds
                    }
                }
            });

            // Transform the questions to include parsed correctAnswers
            const transformedQuestions = questions.map(question => ({
                ...question,
                correctAnswers: JSON.parse(question.correctAnswers),
                keywords: question.keywords ? JSON.parse(question.keywords) : []
            }));

            return NextResponse.json(transformedQuestions);
        }

        // Otherwise, create a new question (existing functionality)
        const { question, option1, option2, option3, option4, option5, option6, correctAnswers, difficulty, topic } = body;

        const newQuestion = await prisma.question.create({
            data: {
                question,
                option1,
                option2,
                option3,
                option4,
                option5: option5 || null,
                option6: option6 || null,
                correctAnswers: JSON.stringify(correctAnswers),
                difficulty,
                topic,
            },
        });

        // Return the question with parsed correctAnswers
        const transformedQuestion = {
            ...newQuestion,
            correctAnswers: JSON.parse(newQuestion.correctAnswers),
            keywords: newQuestion.keywords ? JSON.parse(newQuestion.keywords) : []
        };

        return NextResponse.json(transformedQuestion);
    } catch (error) {
        console.error('Error handling question request:', error);
        return NextResponse.json(
            { error: 'Failed to handle question request' },
            { status: 500 }
        );
    }
}
