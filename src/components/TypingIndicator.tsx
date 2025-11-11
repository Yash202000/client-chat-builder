import React from 'react';

interface TypingIndicatorProps {
  backgroundColor?: string;
  dotColor?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  backgroundColor = '#E6E6E6',
  dotColor = '#FFFFFF',
}) => {
  return (
    <>
      <style>{`
        .typing-indicator-bubble {
          display: inline-flex;
          align-items: flex-end;
          gap: 4px;
          padding: 10px 14px;
          border-radius: 18px;
          min-width: 60px;
          height: 40px;
          justify-content: center;
        }

        .typing-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          animation: typingBounce 1.4s infinite ease-in-out;
        }

        .typing-dot:nth-child(1) {
          animation-delay: -0.32s;
        }

        .typing-dot:nth-child(2) {
          animation-delay: -0.16s;
        }

        .typing-dot:nth-child(3) {
          animation-delay: 0s;
        }

        @keyframes typingBounce {
          0%, 80%, 100% {
            opacity: 0.5;
            transform: translateY(0);
          }
          40% {
            opacity: 1;
            transform: translateY(-10px);
          }
        }
      `}</style>
      <div
        className="typing-indicator-bubble"
        style={{ backgroundColor }}
      >
        <div className="typing-dot" style={{ backgroundColor: dotColor }} />
        <div className="typing-dot" style={{ backgroundColor: dotColor }} />
        <div className="typing-dot" style={{ backgroundColor: dotColor }} />
      </div>
    </>
  );
};
