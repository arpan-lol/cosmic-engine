import type { Components } from 'react-markdown';

export const markdownComponents: Components = {
  code: ({ className, children, ...props }: any) => {
    const isInline = !className?.includes('language-');
    return isInline ? (
      <code className="bg-muted px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children, ...props }) => (
    <pre className="bg-muted p-4 rounded-lg overflow-x-auto" {...props}>
      {children}
    </pre>
  ),
  a: ({ children, ...props }) => (
    <a className="text-primary hover:underline" target="_blank" rel="noopener noreferrer" {...props}>
      {children}
    </a>
  ),
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto">
      <table className="border-collapse border border-border" {...props}>
        {children}
      </table>
    </div>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-border px-4 py-2 bg-muted" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-border px-4 py-2" {...props}>
      {children}
    </td>
  ),
};
