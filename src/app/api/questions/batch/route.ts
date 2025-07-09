import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
    try {
        const { questionIds }: { questionIds: string[] } = await request.json();

        if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
            return NextResponse.json(
                { error: 'Question IDs are required' },
                { status: 400 }
            );
        }

        const questions = await prisma.question.findMany({
            where: {
                id: {
                    in: questionIds
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        // Transform the data to match the expected format
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: Array.isArray(question.correctAnswers) 
                ? question.correctAnswers.map((ans: any) => typeof ans === 'string' ? parseInt(ans, 10) : ans)
                : []
        }));

        return NextResponse.json(transformedQuestions);
    } catch (error) {
        console.error('Error fetching questions by IDs:', error);
        return NextResponse.json(
            { error: 'Failed to fetch questions' },
            { status: 500 }
        );
    }
}
