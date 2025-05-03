import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { DrinkWithCategory, Category } from "@shared/schema";
import { useAuth } from "@/contexts/AuthContext";
import { getInitials } from "@/lib/utils";
import DrinkCard from "@/components/DrinkCard";
import CategoryPill from "@/components/CategoryPill";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function CafePage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Fetch categories
  const { data: categories } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });
  
  // Fetch popular drinks
  const { data: popularDrinks } = useQuery<DrinkWithCategory[]>({
    queryKey: ['/api/drinks/popular'],
  });
  
  // Fetch all drinks
  const { data: allDrinks, isLoading: isLoadingDrinks } = useQuery<DrinkWithCategory[]>({
    queryKey: ['/api/drinks'],
  });
  
  // Fetch drinks by category if one is selected
  const { data: categoryDrinks, isLoading: isLoadingCategoryDrinks } = useQuery<DrinkWithCategory[]>({
    queryKey: ['/api/categories', activeCategory, 'drinks'],
    enabled: activeCategory !== null,
  });
  
  // Fetch search results if query is provided
  const { data: searchResults, isLoading: isLoadingSearch } = useQuery<DrinkWithCategory[]>({
    queryKey: [`/api/drinks/search?q=${encodeURIComponent(debouncedQuery)}`],
    enabled: debouncedQuery.length > 0,
  });
  
  // Determine which drinks to display
  const displayedDrinks = () => {
    if (debouncedQuery) {
      return searchResults || [];
    }
    
    if (activeCategory) {
      return categoryDrinks || [];
    }
    
    return allDrinks || [];
  };
  
  const isLoading = isLoadingDrinks || (activeCategory && isLoadingCategoryDrinks) || (debouncedQuery && isLoadingSearch);
  
  const handleCategoryChange = (categoryId: number | null) => {
    setActiveCategory(categoryId);
    setSearchQuery("");
    setDebouncedQuery("");
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Sip & Savor</h1>
          <p className="text-gray-600 text-sm">What would you like to drink today?</p>
        </div>
        <div className="relative">
          <div className="h-10 w-10 bg-primary rounded-full flex items-center justify-center text-white font-medium cursor-pointer">
            {user ? getInitials(user.name) : "G"}
          </div>
        </div>
      </div>
      
      <div className="bg-gray-100 rounded-lg p-2 flex items-center mb-6">
        <Search className="text-gray-400 mx-2" size={18} />
        <Input 
          type="text" 
          placeholder="Search for drinks..." 
          className="bg-transparent w-full p-2 focus:outline-none border-0 focus:ring-0"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {!debouncedQuery && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Categories</h2>
          </div>
          <div className="flex space-x-3 overflow-x-auto pb-2 no-scrollbar">
            <CategoryPill 
              category={{ id: 0, name: "All", slug: "all" }}
              isActive={activeCategory === null}
              onClick={() => handleCategoryChange(null)}
            />
            
            {categories?.map(category => (
              <CategoryPill 
                key={category.id}
                category={category}
                isActive={activeCategory === category.id}
                onClick={() => handleCategoryChange(category.id)}
              />
            ))}
          </div>
        </div>
      )}
      
      {!debouncedQuery && !activeCategory && popularDrinks && popularDrinks.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Popular Drinks</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {popularDrinks.map((drink) => (
              <DrinkCard key={drink.id} drink={drink} />
            ))}
          </div>
        </div>
      )}
      
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-800">
            {debouncedQuery 
              ? `Search Results (${searchResults?.length || 0})`
              : activeCategory 
                ? categories?.find(c => c.id === activeCategory)?.name || "Drinks"
                : "All Drinks"}
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 h-32 rounded-t-xl"></div>
                <div className="bg-white p-3 rounded-b-xl">
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-12 bg-gray-200 rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 rounded-full"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {displayedDrinks().map((drink) => (
              <DrinkCard key={drink.id} drink={drink} />
            ))}
          </div>
        )}
        
        {displayedDrinks().length === 0 && !isLoading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No drinks found. Try a different search or category.</p>
          </div>
        )}
      </div>
    </div>
  );
}
