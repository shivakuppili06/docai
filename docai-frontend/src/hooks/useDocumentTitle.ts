import { useEffect } from 'react';

export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title ? `${title} — DocAI` : 'DocAI';
  }, [title]);
}
