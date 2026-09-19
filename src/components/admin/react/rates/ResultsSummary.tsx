type ResultsSummaryProps = {
  fromPage: number,
  toPage: number,
  totalItems: number
}

function ResultsSummary({fromPage, toPage, totalItems}: ResultsSummaryProps) {
  return <div className="small ms-1">
    <span className="me-1">Showing</span>
    <span className="fw-semibold">{fromPage}</span> to{' '}
    <span className="fw-semibold">{toPage} </span>
    of <span className="fw-semibold">{totalItems}</span>
    <span className="ms-1">rates</span>
  </div>
}

export default ResultsSummary
