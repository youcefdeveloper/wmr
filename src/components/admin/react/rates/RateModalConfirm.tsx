type NewRateButtonProps = {
  title: string
  date: string
}

function RateModalConfirm({ title, date }: NewRateButtonProps) {

  return (
    <div className="modal modal-alert fade" id="deleteRate" tabIndex={-1} aria-labelledby="deleteRateLabel" aria-hidden="true">
      <div className="modal-dialog modal-fullscreen-sm-down-- modal-sheet-sm">
        <div className="modal-content">
          <div className="modal-header d-flex justify-content-between align-items-center">
            <h1 className="modal-title fs-5 fw-bold mb-0" id="exampleModalLabel">{title}</h1>
            <a href="#" className="bi bi-x-lg h4 mb-0" data-bs-dismiss="modal" aria-label="Close"></a>
          </div>
          <div className="modal-body">
            <p className="lead">Are you sure you want to remove &ldquo;{date}&rdquo; rate(s)?</p>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-lg btn-modal btn-danger fw-light">Confirm</button>
            <button type="button" className="btn btn-lg btn-transparent fw-light" data-bs-dismiss="modal">Cancel
            </button>
          </div>
        </div>
      </div>
    </div>)
}

export default RateModalConfirm
