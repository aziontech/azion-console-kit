import fm from 'front-matter';

export const markdownToHtml = (document) => {
  const content = fm(document);
  return content.attributes.docs;
}