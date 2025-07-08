'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle, ArrowLeft, Trophy, AlertTriangle, ChevronDown, ChevronUp, Brain } from 'lucide-react';
import MarkdownRenderer from '@/components/MarkdownRenderer';

interface ScoreResult {
    correctCount: number;
    total: number;
    percentage: number;
    estimatedScore: string;
    evaluation: string;
    status: 'pass' | 'borderline' | 'fail';
}

interface Question {
    id: string;
    question: string;
    option1: string;
    option2: string;
    option3: string;
    option4: string;
    option5?: string;
    option6?: string;
    correctAnswers: number[];
    explanation?: string;
    keywords?: string[];
    topic: string;
    difficulty: string;
}

interface TestAttempt {
    id: string;
    questionId: string;
    selectedAnswers: number[];
    isCorrect: boolean;
    question: Question;
}

function TestResultsContent() {
    const searchParams = useSearchParams();
    const [result, setResult] = useState<ScoreResult | null>(null);
    const [detailedResults, setDetailedResults] = useState<TestAttempt[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());
    const [filter, setFilter] = useState<'all' | 'correct' | 'incorrect'>('all');
    const sessionId = searchParams.get('sessionId');

    useEffect(() => {
        const correct = parseInt(searchParams.get('correct') || '0');
        const total = parseInt(searchParams.get('total') || '65');

        const percentage = (correct / total) * 100;
        let estimatedScore = '';
        let evaluation = '';
        let status: 'pass' | 'borderline' | 'fail' = 'fail';

        // 점수 기준에 따른 평가
        if (correct >= 50) {
            estimatedScore = '750~850점 예상';
            evaluation = '안정권 합격';
            status = 'pass';
        } else if (correct >= 45) {
            estimatedScore = '720점 이상';
            evaluation = '합격 가능';
            status = 'borderline';
        } else {
            estimatedScore = '700점 미만';
            evaluation = '불합격 가능성 높음';
            status = 'fail';
        }

        setResult({
            correctCount: correct,
            total,
            percentage: Math.round(percentage * 10) / 10,
            estimatedScore,
            evaluation,
            status
        });
    }, [searchParams]);

    if (!result) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">결과를 불러오고 있습니다...</div>
            </div>
        );
    }

    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        return `${hours}시간 ${minutes}분 ${secs}초`;
    };

    const fetchDetailedResults = async () => {
        if (!sessionId) return;

        setLoading(true);
        try {
            const response = await fetch(`/api/test-sessions/${sessionId}`);
            if (response.ok) {
                const data = await response.json();
                setDetailedResults(data.attempts);
            } else {
                console.error('Failed to fetch detailed results');
            }
        } catch (error) {
            console.error('Error fetching detailed results:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleQuestion = (questionId: string) => {
        const newExpanded = new Set(expandedQuestions);
        if (newExpanded.has(questionId)) {
            newExpanded.delete(questionId);
        } else {
            newExpanded.add(questionId);
        }
        setExpandedQuestions(newExpanded);
    };

    const filteredResults = detailedResults.filter(attempt => {
        if (filter === 'correct') return attempt.isCorrect;
        if (filter === 'incorrect') return !attempt.isCorrect;
        return true;
    });

    const renderOption = (optionText: string, index: number, attempt: TestAttempt) => {
        const isSelected = attempt.selectedAnswers.includes(index);
        const isCorrect = attempt.question.correctAnswers.includes(index);

        let className = "p-3 rounded-lg border-2 ";

        if (isCorrect && isSelected) {
            className += "border-green-500 bg-green-50 text-green-900";
        } else if (isCorrect) {
            className += "border-green-500 bg-green-50 text-green-900";
        } else if (isSelected) {
            className += "border-red-500 bg-red-50 text-red-900";
        } else {
            className += "border-gray-200 text-gray-700";
        }

        return (
            <div key={index} className={className}>
                <div className="flex items-center justify-between">
                    <span>{optionText}</span>
                    <div className="flex items-center space-x-2">
                        {isSelected && (
                            <span className={`text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                                선택됨
                            </span>
                        )}
                        {isCorrect && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                        )}
                        {isSelected && !isCorrect && (
                            <XCircle className="h-5 w-5 text-red-600" />
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const timeSpent = parseInt(searchParams.get('timeSpent') || '0');

    return (
        <div className="min-h-screen bg-white">
            <div className="container mx-auto px-4 py-8">
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-800">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        홈으로 돌아가기
                    </Link>
                </div>

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">
                            AWS SAA-C03 모의시험 결과
                        </h1>
                        <p className="text-gray-600">
                            시험이 완료되었습니다. 아래에서 결과를 확인하세요.
                        </p>
                    </div>

                    {/* Main Result Card */}
                    <Card className={`border-2 mb-8 ${result.status === 'pass' ? 'border-green-200 bg-green-50' :
                        result.status === 'borderline' ? 'border-yellow-200 bg-yellow-50' :
                            'border-red-200 bg-red-50'
                        }`}>
                        <CardHeader className="text-center pb-4">
                            <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${result.status === 'pass' ? 'bg-green-100' :
                                result.status === 'borderline' ? 'bg-yellow-100' :
                                    'bg-red-100'
                                }`}>
                                {result.status === 'pass' ? (
                                    <Trophy className="h-8 w-8 text-green-600" />
                                ) : result.status === 'borderline' ? (
                                    <CheckCircle className="h-8 w-8 text-yellow-600" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-red-600" />
                                )}
                            </div>
                            <CardTitle className={`text-2xl ${result.status === 'pass' ? 'text-green-900' :
                                result.status === 'borderline' ? 'text-yellow-900' :
                                    'text-red-900'
                                }`}>
                                {result.evaluation}
                            </CardTitle>
                            <CardDescription className={`text-lg ${result.status === 'pass' ? 'text-green-700' :
                                result.status === 'borderline' ? 'text-yellow-700' :
                                    'text-red-700'
                                }`}>
                                {result.estimatedScore}
                            </CardDescription>
                        </CardHeader>
                    </Card>

                    {/* Detailed Results */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                        <Card className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-900">점수 상세</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">정답 개수</span>
                                    <span className="text-2xl font-bold text-green-600">
                                        {result.correctCount}개
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">오답 개수</span>
                                    <span className="text-2xl font-bold text-red-600">
                                        {result.total - result.correctCount}개
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">정답률</span>
                                    <span className="text-2xl font-bold text-blue-600">
                                        {result.percentage}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">총 문제 수</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {result.total}문제
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border border-gray-200">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-900">시험 정보</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">소요 시간</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {formatTime(timeSpent)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">시험 유형</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        모의시험 (65문제)
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-gray-600">완료 일시</span>
                                    <span className="text-lg font-semibold text-gray-900">
                                        {new Date().toLocaleDateString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Score Guide */}
                    <Card className="border border-gray-200 mb-8">
                        <CardHeader>
                            <CardTitle className="text-xl text-gray-900">점수 기준표</CardTitle>
                            <CardDescription>AWS SAA-C03 시험 합격 기준 참고</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">정답 개수</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">정답률</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">예상 점수</th>
                                            <th className="text-left py-2 px-3 font-semibold text-gray-900">평가</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className={`border-b ${result.correctCount >= 50 ? 'bg-green-50' : ''}`}>
                                            <td className="py-2 px-3">50문항 이상</td>
                                            <td className="py-2 px-3">약 77% 이상</td>
                                            <td className="py-2 px-3">750~850점 예상</td>
                                            <td className="py-2 px-3 text-green-600 font-semibold">안정권 합격</td>
                                        </tr>
                                        <tr className={`border-b ${result.correctCount >= 45 && result.correctCount < 50 ? 'bg-yellow-50' : ''}`}>
                                            <td className="py-2 px-3">45문항 이상</td>
                                            <td className="py-2 px-3">약 70% 이상</td>
                                            <td className="py-2 px-3">720점 이상</td>
                                            <td className="py-2 px-3 text-yellow-600 font-semibold">합격 가능</td>
                                        </tr>
                                        <tr className={`${result.correctCount < 45 ? 'bg-red-50' : ''}`}>
                                            <td className="py-2 px-3">44문항 이하</td>
                                            <td className="py-2 px-3">70% 미만</td>
                                            <td className="py-2 px-3">700점 미만</td>
                                            <td className="py-2 px-3 text-red-600 font-semibold">불합격 가능성 높음</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                        <Link href="/test">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                다시 시험보기
                            </Button>
                        </Link>
                        <Link href="/practice">
                            <Button variant="outline" className="border-gray-300">
                                문제 연습하기
                            </Button>
                        </Link>
                        <Link href="/review">
                            <Button variant="outline" className="border-gray-300">
                                틀린 문제 복습
                            </Button>
                        </Link>
                        {sessionId && (
                            <Button
                                onClick={() => {
                                    setShowDetails(!showDetails);
                                    if (!showDetails && detailedResults.length === 0) {
                                        fetchDetailedResults();
                                    }
                                }}
                                variant="outline"
                                className="border-blue-300 text-blue-600 hover:bg-blue-50"
                            >
                                <Brain className="h-4 w-4 mr-2" />
                                {showDetails ? '문제별 결과 숨기기' : '문제별 결과 보기'}
                            </Button>
                        )}
                    </div>

                    {/* Detailed Question Results */}
                    {showDetails && sessionId && (
                        <Card className="border border-gray-200 mb-8">
                            <CardHeader>
                                <CardTitle className="text-xl text-gray-900">문제별 상세 결과</CardTitle>
                                <CardDescription>
                                    각 문제의 정답, 오답, 해설을 확인할 수 있습니다.
                                </CardDescription>

                                {/* Filter Buttons */}
                                <div className="flex gap-2 mt-4">
                                    <Button
                                        size="sm"
                                        variant={filter === 'all' ? 'default' : 'outline'}
                                        onClick={() => setFilter('all')}
                                    >
                                        전체 ({detailedResults.length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={filter === 'correct' ? 'default' : 'outline'}
                                        onClick={() => setFilter('correct')}
                                        className={filter === 'correct' ? 'bg-green-600 hover:bg-green-700' : 'text-green-600 border-green-300 hover:bg-green-50'}
                                    >
                                        정답 ({detailedResults.filter(a => a.isCorrect).length})
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant={filter === 'incorrect' ? 'default' : 'outline'}
                                        onClick={() => setFilter('incorrect')}
                                        className={filter === 'incorrect' ? 'bg-red-600 hover:bg-red-700' : 'text-red-600 border-red-300 hover:bg-red-50'}
                                    >
                                        오답 ({detailedResults.filter(a => !a.isCorrect).length})
                                    </Button>
                                </div>
                            </CardHeader>

                            <CardContent>
                                {loading ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-600">문제별 결과를 불러오고 있습니다...</div>
                                    </div>
                                ) : filteredResults.length === 0 ? (
                                    <div className="text-center py-8">
                                        <div className="text-gray-600">
                                            {filter === 'correct' ? '정답 문제가 없습니다.' :
                                                filter === 'incorrect' ? '오답 문제가 없습니다.' :
                                                    '결과가 없습니다.'}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredResults.map((attempt) => {
                                            // Find the original question number in the full test
                                            const originalIndex = detailedResults.findIndex(a => a.id === attempt.id);

                                            return (
                                                <div
                                                    key={attempt.id}
                                                    className={`border rounded-lg p-4 ${attempt.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center justify-between mb-3">
                                                        <div className="flex items-center space-x-3">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                문제 {originalIndex + 1}
                                                            </span>
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${attempt.isCorrect
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                                }`}>
                                                                {attempt.isCorrect ? '정답' : '오답'}
                                                            </span>
                                                            <span className="text-xs text-gray-500">
                                                                {attempt.question.topic} • {attempt.question.difficulty}
                                                            </span>
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => toggleQuestion(attempt.questionId)}
                                                            className="text-gray-600 hover:text-gray-800"
                                                        >
                                                            {expandedQuestions.has(attempt.questionId) ? (
                                                                <>
                                                                    <ChevronUp className="h-4 w-4 mr-1" />
                                                                    접기
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <ChevronDown className="h-4 w-4 mr-1" />
                                                                    자세히
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>

                                                    <div className="mb-3">
                                                        <h4 className="font-medium text-gray-900 mb-2">문제</h4>
                                                        <p className="text-gray-700 whitespace-pre-wrap">
                                                            {attempt.question.question}
                                                        </p>
                                                    </div>

                                                    {expandedQuestions.has(attempt.questionId) && (
                                                        <div className="space-y-4">
                                                            <div>
                                                                <h5 className="font-medium text-gray-900 mb-3">선택지</h5>
                                                                <div className="space-y-2">
                                                                    {[
                                                                        attempt.question.option1,
                                                                        attempt.question.option2,
                                                                        attempt.question.option3,
                                                                        attempt.question.option4,
                                                                        attempt.question.option5,
                                                                        attempt.question.option6,
                                                                    ].filter(Boolean).map((option, idx) =>
                                                                        renderOption(option!, idx, attempt)
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {attempt.question.explanation && (
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900 mb-2">해설</h5>
                                                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                                                        <MarkdownRenderer content={attempt.question.explanation} />
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {attempt.question.keywords && attempt.question.keywords.length > 0 && (
                                                                <div>
                                                                    <h5 className="font-medium text-gray-900 mb-2">키워드</h5>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {attempt.question.keywords.map((keyword, idx) => (
                                                                            <span
                                                                                key={idx}
                                                                                className="px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-sm"
                                                                            >
                                                                                {keyword}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}

                    {/* Additional Tips */}
                    <Card className="border border-gray-200 mt-8">
                        <CardHeader>
                            <CardTitle className="text-lg text-gray-900">학습 권장사항</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3 text-sm text-gray-700">
                                {result.status === 'pass' && (
                                    <div className="flex items-start space-x-2">
                                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <p>훌륭한 성과입니다! 실제 시험에서도 좋은 결과를 기대할 수 있습니다. 꾸준한 복습을 통해 실력을 유지하세요.</p>
                                    </div>
                                )}
                                {result.status === 'borderline' && (
                                    <div className="flex items-start space-x-2">
                                        <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                                        <p>합격 가능한 수준입니다. 틀린 문제들을 중심으로 추가 학습하여 안정권 진입을 목표로 하세요.</p>
                                    </div>
                                )}
                                {result.status === 'fail' && (
                                    <div className="flex items-start space-x-2">
                                        <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                                        <p>추가 학습이 필요합니다. 기본 개념을 다시 정리하고, 문제 연습을 통해 실력을 향상시키세요.</p>
                                    </div>
                                )}
                                <div className="flex items-start space-x-2">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    <p>틀린 문제 복습 기능을 활용하여 약점을 보완하세요.</p>
                                </div>
                                <div className="flex items-start space-x-2">
                                    <div className="h-2 w-2 bg-gray-400 rounded-full mt-2 flex-shrink-0" />
                                    <p>정기적인 모의시험을 통해 실전 감각을 유지하세요.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function TestResultsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="text-gray-600">결과를 불러오고 있습니다...</div>
            </div>
        }>
            <TestResultsContent />
        </Suspense>
    );
}
