import { Category } from "@/types/category";

export default ({ category }: { category: Category }) => {
  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol role="list" className="flex items-center space-x-2 text-sm">
        <li>
          <a className="text-[#8b8d98] hover:text-white transition-colors" href="/">
            Home
          </a>
        </li>
        <li>
          <span className="text-[#2a2d3a] mx-1">/</span>
          <a
            className="text-[#8b8d98] hover:text-white transition-colors"
            href="/categories"
          >
            Categories
          </a>
        </li>
        <li>
          <span className="text-[#2a2d3a] mx-1">/</span>
          <span className="text-[#00ff88]">{category.title}</span>
        </li>
      </ol>
    </nav>
  );
};
