/** Apply embedded layout before hydration, without changing the standalone site. */
export function prepareMcpPage(html: string) {
  return html.replace(/<html\b/, '<html data-embedded="true" data-display-mode="inline"');
}
