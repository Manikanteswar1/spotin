import { Category } from "@shared/schema";

interface CategoryPillProps {
  category: Category | { id: number, name: string, slug: string };
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryPill({ category, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      className={`category-item flex-shrink-0 px-4 py-2 rounded-full ${
        isActive 
          ? "bg-primary text-white" 
          : "bg-white text-gray-700 shadow-sm"
      }`}
      onClick={onClick}
    >
      {category.name}
    </button>
  );
}
