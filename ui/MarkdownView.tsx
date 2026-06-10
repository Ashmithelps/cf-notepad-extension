import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

interface Props {
  body: string;
}

export function MarkdownView({ body }: Props) {
  return (
    <div className="md">
      <Markdown
        skipHtml
        rehypePlugins={[
          [
            rehypeHighlight,
            {
              detect: true,
              ignoreMissing: true,
            },
          ],
        ]}
      >
        {body}
      </Markdown>
    </div>
  );
}
