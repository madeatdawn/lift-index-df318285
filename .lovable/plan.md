

## Add Drag-and-Drop Answer Option Reordering

### What changes

Add drag-and-drop reordering for answer options within each question in the Admin Panel. You'll be able to grab any option and drag it to a new position within the same question.

### Technical details

**New dependency**: `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` — lightweight, well-maintained React DnD library.

**`src/pages/Admin.tsx`**:
- Wrap each question's options list in a `DndContext` + `SortableContext` from dnd-kit.
- Extract each option row into a `SortableOptionItem` component that uses `useSortable` for drag handles.
- Add a grip/drag-handle icon (`GripVertical` from lucide-react) to each option row.
- On `onDragEnd`, reorder the options array in state using `arrayMove` from `@dnd-kit/sortable`.

No backend changes needed — the existing save flow already uses array index as `sort_order`.

