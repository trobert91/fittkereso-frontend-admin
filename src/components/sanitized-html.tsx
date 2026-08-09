export const SanitizedHtml = ({
  html,
  inline,
}: {
  html: string | undefined;
  inline?: boolean;
}) => {
  if (!html) {
    return <></>;
  }

  const Tag = inline ? "span" : "div";

  return (
    <Tag
      dangerouslySetInnerHTML={{
        __html:
          html
            ?.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;")
            .replaceAll("\n", "<br/>") ?? "",
      }}
    />
  );
};

