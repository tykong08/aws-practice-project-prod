import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const sessionId = params.id;

        // Get the test session
        const session = await prisma.studySession.findUnique({
            where: { id: sessionId }
        });

        if (!session) {
            return NextResponse.json(
                { error: 'Test session not found' },
                { status: 404 }
            );
        }

        // Get all attempts for this session (by userId and time range)
        const sessionStartTime = session.createdAt;
        const sessionEndTime = new Date(sessionStartTime.getTime() + (session.timeSpent * 1000));

        const attempts = await prisma.userAttempt.findMany({
            where: {
                userId: session.userId,
                createdAt: {
                    gte: sessionStartTime,
                    lte: sessionEndTime
                }
            },
            include: {
                question: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });

        // Transform the data
        const transformedAttempts = attempts.map(attempt => {
            let selectedAnswers;
            try {
                const parsed = JSON.parse(attempt.selectedAnswers);

                // Handle legacy/invalid data - if array contains 0 or 4, it's likely 0-based already
                if (Array.isArray(parsed) && parsed.some(answer => answer === 0 || answer >= 5)) {
                    selectedAnswers = parsed; // Keep as is (already 0-based or invalid data)
                } else {
                    selectedAnswers = parsed.map((answer: number) => answer - 1); // Convert 1-based to 0-based
                }
            } catch (error) {
                console.error('Error parsing selectedAnswers:', error);
                selectedAnswers = [];
            }

            return {
                ...attempt,
                selectedAnswers,
                question: {
                    ...attempt.question,
                    correctAnswers: JSON.parse(attempt.question.correctAnswers),
                    keywords: attempt.question.keywords ? JSON.parse(attempt.question.keywords) : []
                }
            };
        });

        return NextResponse.json({
            session,
            attempts: transformedAttempts
        });
    } catch (error) {
        console.error('Error fetching test session details:', error);
        return NextResponse.json(
            { error: 'Failed to fetch test session details' },
            { status: 500 }
        );
    }
}
