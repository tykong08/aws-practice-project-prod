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

        // Remove duplicates from the input array for safety
        const uniqueQuestionIds = Array.from(new Set(questionIds));

        console.log(`📝 Fetching ${uniqueQuestionIds.length} unique questions from ${questionIds.length} requested IDs`);

        const questions = await prisma.question.findMany({
            where: {
                id: {
                    in: uniqueQuestionIds
                }
            },
            orderBy: {
                id: 'asc'
            }
        });

        console.log(`✅ Found ${questions.length} questions in database`);

        // Transform the data to match the expected format
        const transformedQuestions = questions.map(question => ({
            ...question,
            correctAnswers: JSON.parse(question.correctAnswers),
            keywords: question.keywords ? JSON.parse(question.keywords) : []
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
