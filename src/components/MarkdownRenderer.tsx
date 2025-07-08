import React from 'react';

interface MarkdownRendererProps {
    content: string;
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
    // 기본적인 마크다운 파싱 함수
    const parseMarkdown = (text: string) => {
        // 줄 단위로 분리
        const lines = text.split('\n');
        const elements: React.ReactElement[] = [];
        let currentIndex = 0;

        lines.forEach((line, index) => {
            const trimmedLine = line.trim();
            
            // 빈 줄 처리
            if (!trimmedLine) {
                elements.push(<br key={`br-${index}`} />);
                return;
            }

            // 헤딩 처리
            if (trimmedLine.startsWith('### ')) {
                elements.push(
                    <h3 key={index} className="text-lg font-bold mb-2 text-gray-800">
                        {trimmedLine.substring(4)}
                    </h3>
                );
            } else if (trimmedLine.startsWith('## ')) {
                elements.push(
                    <h2 key={index} className="text-xl font-bold mb-3 text-gray-800">
                        {trimmedLine.substring(3)}
                    </h2>
                );
            } else if (trimmedLine.startsWith('# ')) {
                elements.push(
                    <h1 key={index} className="text-2xl font-bold mb-4 text-gray-800">
                        {trimmedLine.substring(2)}
                    </h1>
                );
            }
            // 순서 있는 리스트 처리
            else if (/^\d+\.\s/.test(trimmedLine)) {
                const content = trimmedLine.replace(/^\d+\.\s/, '');
                elements.push(
                    <div key={index} className="mb-2">
                        <span className="font-semibold text-blue-600 mr-2">
                            {trimmedLine.match(/^\d+/)?.[0]}.
                        </span>
                        <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
                    </div>
                );
            }
            // 순서 없는 리스트 처리
            else if (trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ')) {
                const content = trimmedLine.substring(2);
                elements.push(
                    <div key={index} className="mb-2 flex items-start">
                        <span className="text-blue-600 mr-2 mt-1">•</span>
                        <span dangerouslySetInnerHTML={{ __html: formatInlineText(content) }} />
                    </div>
                );
            }
            // 일반 문단 처리
            else {
                elements.push(
                    <p key={index} className="mb-3 leading-relaxed" 
                       dangerouslySetInnerHTML={{ __html: formatInlineText(trimmedLine) }} />
                );
            }
        });

        return elements;
    };

    // 인라인 텍스트 포맷팅 (굵은 글씨, 이탤릭, 코드 등)
    const formatInlineText = (text: string): string => {
        return text
            // 굵은 글씨 **text** 
            .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-blue-600">$1</strong>')
            // 이탤릭 *text*
            .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
            // 인라인 코드 `code`
            .replace(/`(.*?)`/g, '<code class="bg-gray-100 px-2 py-1 rounded text-sm font-mono">$1</code>')
            // AWS 서비스명 강조 (대문자로 시작하는 AWS 관련 용어)
            .replace(/\b(AWS|Amazon|EC2|S3|RDS|VPC|IAM|CloudFormation|Lambda|ECS|EKS|ElastiCache|DynamoDB|Aurora|CloudWatch|SNS|SQS|API Gateway|Load Balancer|Auto Scaling|Route 53|CloudFront|EBS|EFS|FSx)\b/g, 
                '<span class="font-semibold text-orange-600">$1</span>');
    };

    return (
        <div className="prose prose-slate max-w-none">
            <div className="space-y-2">
                {parseMarkdown(content)}
            </div>
        </div>
    );
}
