const occasionCategoryMap: Record<string, string> = {
  anniversary: "love",
  birthday: "birthday",
  birthdays: "birthday",
  celebration: "birthday",
  encouragement: "sympathy",
  friend: "thanks",
  gratitude: "thanks",
  love: "love",
  original: "originals",
  originals: "originals",
  sympathy: "sympathy",
  support: "sympathy",
  thank: "thanks",
  thanks: "thanks",
  "thank you": "thanks",
};

function normalizeOccasion(value: string) {
  return value.trim().toLowerCase();
}

function formatCategoryLabel(category: string) {
  if (category === "thanks") {
    return "Thank You";
  }

  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function getOccasionDiscoveryLink(occasion: string) {
  const normalized = normalizeOccasion(occasion);
  const mappedCategory = occasionCategoryMap[normalized];

  if (mappedCategory) {
    return {
      href: `/shop?occasion=${encodeURIComponent(mappedCategory)}`,
      label: `Shop ${formatCategoryLabel(mappedCategory)} Cards`,
    };
  }

  if (normalized) {
    return {
      href: `/search?q=${encodeURIComponent(occasion.trim())}`,
      label: "Find Cards",
    };
  }

  return {
    href: "/shop",
    label: "Browse Cards",
  };
}
