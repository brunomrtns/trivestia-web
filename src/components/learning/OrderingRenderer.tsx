import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import type { Question, OrderingAnswer, QuestionOption } from '@/types/api';

interface Props {
  question: Question;
  value: OrderingAnswer | null;
  onChange: (answer: OrderingAnswer) => void;
}

function SortableItem({ option }: { option: QuestionOption }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: option.id });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm font-medium shadow-sm transition-shadow ${isDragging ? 'opacity-60 shadow-lg' : 'hover:shadow-md'}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
        aria-label="Arrastar para reordenar"
      >
        <GripVertical className="h-5 w-5" />
      </button>
      {option.text}
    </div>
  );
}

export function OrderingRenderer({ question, value, onChange }: Props) {
  const initialOrder = question.options.map((o) => o.id);
  const currentOrder = value?.orderedOptionIds ?? initialOrder;

  // Mantém a lista ordenada em estado local derivado do valor
  const [items, setItems] = useState<string[]>(currentOrder);

  const sensors = useSensors(useSensor(PointerSensor));

  const optionMap = Object.fromEntries(question.options.map((o) => [o.id, o]));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.indexOf(String(active.id));
    const newIndex = items.indexOf(String(over.id));
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);
    onChange({ orderedOptionIds: reordered });
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Arraste para ordenar (ou use teclado: Espaço + Setas)
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items} strategy={verticalListSortingStrategy}>
          {items.map((id) =>
            optionMap[id] ? <SortableItem key={id} option={optionMap[id]} /> : null,
          )}
        </SortableContext>
      </DndContext>
    </div>
  );
}
