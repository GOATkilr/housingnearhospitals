// Server component — renders JSON-LD structured data
// Usage: <JsonLd data={generateWebSiteJsonLd()} />

export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
