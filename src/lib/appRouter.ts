type NewsNavigator = (newsId: string) => void;

let navigateToNews: NewsNavigator | null = null;

export const registerNewsNavigator = (handler: NewsNavigator) => {
  navigateToNews = handler;
  return () => {
    navigateToNews = null;
  };
};

export const buildNewsArticlePath = (newsId: string) => `/news/${newsId}`;

/** @deprecated Use buildNewsArticlePath — kept for test compatibility */
export const buildNewsArticleHash = buildNewsArticlePath;

export const openNewsArticle = (newsId: string) => {
  navigateToNews?.(newsId);
};
