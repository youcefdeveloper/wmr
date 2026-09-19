import RateModalConfirm from '@components/admin/react/rates/RateModalConfirm.tsx'
import RateModal from '@components/admin/react/rates/RateModal.tsx'

type NewRateButtonProps = {
  date: string
}

function NewRateButton({ date }: NewRateButtonProps) {


  return <>
    <a className="btn btn-outline-dark btn-hover pe-3" href="#" data-bs-toggle="modal" data-bs-target="#addRate">
      <i className="bi bi-plus-lg btn-icon me-1"></i>New Rate
    </a>
    <RateModal
      title={'New Rate(s)'}
      date={date}
    />
    <RateModalConfirm
      title={'Remove Rate(s)'}
      date={date}
    />
  </>
}

export default NewRateButton
