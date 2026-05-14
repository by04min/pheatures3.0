// a shared page wrapper!
// this just makes sure every page in the UI will have the same layout
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-white p-20">
      {children}
    </div>
  )
}
