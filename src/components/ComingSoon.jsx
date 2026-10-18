// Placeholder for the sections that haven't been built yet.
export function ComingSoon({ title, children }) {
  return (
    <main className="page">
      <div className="empty">
        <h2>{title} is on its way</h2>
        <p>{children}</p>
      </div>
    </main>
  )
}
