'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSection } from './SortableSection';
import { Section, LineItem } from './QuoteSectionCard';

interface SortableSectionListProps {
  sections: Section[];
  onSectionsReorder: (sections: Section[]) => void;
  onDeleteSection: (sectionId: string) => void;
  onUpdateSectionTitle: (sectionId: string, title: string) => void;
  onAddItem: (sectionId: string) => void;
  onUpdateItem: (sectionId: string, itemId: string, field: keyof LineItem, value: number | string | boolean) => void;
  onDeleteItem: (sectionId: string, itemId: string) => void;
  onMoveItemUp: (sectionId: string, itemId: string) => void;
  onMoveItemDown: (sectionId: string, itemId: string) => void;
  onReorderItems: (sectionId: string, newItems: LineItem[]) => void;
  onMoveItemToSection: (fromSectionId: string, toSectionId: string, itemId: string, newIndex: number) => void;
  onItemDescriptionBlur?: (sectionId: string, itemId: string) => void;
}

export function SortableSectionList({
  sections,
  onSectionsReorder,
  onDeleteSection,
  onUpdateSectionTitle,
  onAddItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onMoveItemToSection,
  onItemDescriptionBlur,
}: SortableSectionListProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeType, setActiveType] = useState<'section' | 'item' | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Find which section contains an item
  const findSectionByItemId = useCallback((itemId: string): Section | undefined => {
    return sections.find((s) => s.line_items.some((i) => i.id === itemId));
  }, [sections]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    setActiveId(String(active.id));
    setActiveType(data?.type === 'section' ? 'section' : 'item');
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over || activeType !== 'item') return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || activeData.type !== 'item') return;

    const activeSectionId = activeData.sectionId;
    let overSectionId: string | null = null;

    if (overData?.type === 'item') {
      overSectionId = overData.sectionId;
    } else if (overData?.type === 'section-drop') {
      overSectionId = overData.sectionId;
    }

    // Cross-section move
    if (overSectionId && activeSectionId !== overSectionId) {
      const overItemId = overData?.type === 'item' ? String(over.id) : null;
      const overSection = sections.find((s) => s.id === overSectionId);
      const newIndex = overItemId
        ? overSection?.line_items.findIndex((i) => i.id === overItemId) ?? 0
        : overSection?.line_items.length ?? 0;

      onMoveItemToSection(activeSectionId, overSectionId, String(active.id), newIndex);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);

    if (!over || active.id === over.id) return;

    if (activeType === 'section') {
      // Section reorder
      const oldIndex = sections.findIndex((s) => s.id === active.id);
      const newIndex = sections.findIndex((s) => s.id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onSectionsReorder(arrayMove(sections, oldIndex, newIndex));
      }
    } else if (activeType === 'item') {
      // Item reorder within same section
      const overData = over.data.current;
      const activeData = active.data.current;

      if (activeData?.type === 'item' && overData?.type === 'item' && activeData.sectionId === overData.sectionId) {
        const sectionId = activeData.sectionId;
        const section = sections.find((s) => s.id === sectionId);
        if (section) {
          const oldIndex = section.line_items.findIndex((i) => i.id === active.id);
          const newIndex = section.line_items.findIndex((i) => i.id === over.id);
          if (oldIndex !== -1 && newIndex !== -1) {
            onReorderItems(sectionId, arrayMove(section.line_items, oldIndex, newIndex));
          }
        }
      }
    }
  };

  // Custom collision detection: prefer items over sections when dragging items
  const collisionDetection: CollisionDetection = useCallback((args) => {
    if (activeType === 'item') {
      // First try pointerWithin (more precise for nested containers)
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      return rectIntersection(args);
    }
    return closestCenter(args);
  }, [activeType]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4">
          {sections.map((section) => (
            <SortableSection
              key={section.id}
              section={section}
              isDragging={activeId === section.id}
              onDelete={() => onDeleteSection(section.id)}
              onUpdateTitle={(title) => onUpdateSectionTitle(section.id, title)}
              onAddItem={() => onAddItem(section.id)}
              onUpdateItem={(itemId, field, value) => onUpdateItem(section.id, itemId, field, value)}
              onDeleteItem={(itemId) => onDeleteItem(section.id, itemId)}
              onItemDescriptionBlur={(itemId) => onItemDescriptionBlur?.(section.id, itemId)}
            />
          ))}
        </div>
      </SortableContext>

      <DragOverlay>
        {activeId && activeType === 'item' ? (
          <div className="flex items-center gap-2 p-2 border rounded-lg bg-white shadow-xl ring-2 ring-orange-400 opacity-95">
            <span className="text-sm text-gray-600">
              {(() => {
                const section = findSectionByItemId(activeId);
                const item = section?.line_items.find((i) => i.id === activeId);
                return item?.description || 'Item';
              })()}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
