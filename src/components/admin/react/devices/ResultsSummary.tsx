type ResultsSummaryProps = {
  fromPage: number,
  toPage: number,
  totalItems: number,
  itemName?: string
}

function ResultsSummary({ fromPage, toPage, totalItems, itemName }: ResultsSummaryProps) {
  return <div className="small ms-1">
    <span className="me-1">Showing</span>
    <span className="fw-semibold">{fromPage}</span> to{' '}
    <span className="fw-semibold">{toPage} </span>
    of <span className="fw-semibold">{totalItems}</span>
    <span className="ms-1">{itemName || 'devices'}</span>
  </div>
}

export default ResultsSummary
