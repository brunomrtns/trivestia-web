import { motion, AnimatePresence } from 'framer-motion';
import type { Activity, Answer, Question } from '@/types/api';
import { QuestionRenderer } from './QuestionRenderer';

interface ActivityQuestionCardProps {
  activity: Activity;
  question: Question;
  answer: Answer | null;
  onChange: (answer: Answer) => void;
}

export function ActivityQuestionCard({
  activity,
  question,
  answer,
  onChange
}: ActivityQuestionCardProps) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={question.id}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl border bg-card p-6 shadow-sm"
      >
        <p className="mb-6 text-base font-semibold leading-relaxed">
          {question.statement}
        </p>
        <QuestionRenderer
          activityType={activity.type}
          question={question}
          value={answer}
          onChange={onChange}
        />
      </motion.div>
    </AnimatePresence>
  );
}
