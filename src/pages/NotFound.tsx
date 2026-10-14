import { Link } from 'react-router'
import { Page } from '../components/Page'

export function NotFound() {
  return (
    <Page>
      <h1>This page does not exist</h1>
      <p className="meta">The link may be out of date. Go back to the welcome page and choose a track.</p>
      <p>
        <Link to="/" className="btn btn-primary">
          Go to the welcome page
        </Link>
      </p>
    </Page>
  )
}
