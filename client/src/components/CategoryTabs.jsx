import React from 'react';
import { Compass, BookOpen, Briefcase, Code, Home, Star, UserCheck, HelpCircle } from 'lucide-react';

const categories = [
  { name: 'All', icon: Compass },
  { name: 'Semester Exam Tips', icon: BookOpen },
  { name: 'Placement Experiences', icon: Briefcase },
  { name: 'Coding Resources', icon: Code },
  { name: 'Hostel Reviews', icon: Home },
  { name: 'Faculty Reviews', icon: UserCheck },
  { name: 'Career Advice', icon: Star },
  { name: 'Others', icon: HelpCircle }
];

const CategoryTabs = ({ selectedCategory, onSelect }) => {
  return (
    <div className="categories-scroller-container">
      <div className="categories-list">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedCategory === (cat.name === 'All' ? '' : cat.name);
          
          return (
            <button
              key={cat.name}
              className={`category-tab-btn ${isSelected ? 'category-tab-btn-active' : ''}`}
              onClick={() => onSelect(cat.name === 'All' ? '' : cat.name)}
            >
              <Icon size={16} />
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .categories-scroller-container {
          width: 100%;
          margin-bottom: 2rem;
          padding: 0.25rem 0 1rem 0;
          display: flex;
          border-bottom: 1px solid var(--border-default);
        }

        .categories-list {
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .category-tab-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.6rem 1.1rem;
          border-radius: 10px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-secondary);
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-default);
          white-space: nowrap;
          transition: all var(--transition-fast);
        }

        .category-tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-surface-hover);
          border-color: rgba(255, 255, 255, 0.15);
          transform: translateY(-1px);
        }

        .category-tab-btn-active {
          color: #ffffff;
          background: rgba(139, 92, 246, 0.15);
          border-color: rgba(139, 92, 246, 0.4);
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.15);
        }

        .category-tab-btn-active:hover {
          background: rgba(139, 92, 246, 0.2);
          border-color: rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
};

export default CategoryTabs;
