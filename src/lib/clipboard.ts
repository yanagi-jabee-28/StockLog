import { InventoryItem, MealLog, Category } from '../types';

/**
 * Formats inventory items and meal logs into a prompt-friendly string for AI.
 */
export const formatForAi = (
  items: InventoryItem[],
  categories: Category[],
  mealLogs: MealLog[] = []
): string => {
  let sections: string[] = [];

  if (items.length > 0) {
    let text = "### 📦 現在の在庫\n";
    
    // Group items by category
    const itemsByCategory = items.reduce((acc, item) => {
      const category = categories.find(c => c.id === item.categoryId)?.name || 'その他';
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {} as Record<string, InventoryItem[]>);

    for (const [category, categoryItems] of Object.entries(itemsByCategory)) {
      text += `#### ${category}\n`;
      categoryItems.forEach(item => {
        let details = "";
        if (item.isOpened) {
          details = ` (使用中: 残り${item.remainingPercent ?? 100}%)`;
        } else {
          details = ` (在庫: ${item.stock}${item.unit})`;
        }
        if (item.expiryDate) {
          details += ` [期限: ${item.expiryDate}]`;
        }
        text += `- ${item.name}${details}\n`;
      });
    }
    sections.push(text.trim());
  }

  if (mealLogs.length > 0) {
    let text = "### 🍳 最近の献立記録\n";
    // Sort by date newest first and take last 5
    const recentMeals = [...mealLogs]
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    recentMeals.forEach(meal => {
      const date = new Date(meal.date).toLocaleDateString('ja-JP');
      text += `- ${date}: ${meal.name}`;
      if (meal.ingredients.length > 0) {
        text += ` (材料: ${meal.ingredients.join(', ')})`;
      }
      text += "\n";
    });
    sections.push(text.trim());
  }

  return sections.join('\n\n').trim();
};

/**
 * Copies text to clipboard with a fallback.
 */
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};
