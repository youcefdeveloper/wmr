import Shimmer from "./Shimmer";


type CardRateSkeletonProps = {
    theme: 'light' | 'dark',
    flip: boolean,
}

const CardRateSkeleton = ({ theme, flip }: CardRateSkeletonProps) => {
    return (
        <div className="skeleton-wrapper">
            <div className={`h-100 card card-${theme}`}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h5 className="card-title mb-0">
                            <span className="skel skel-title-lg"></span>
                        </h5>
                        <h6 className="card-title mb-0">
                            <span className="skel skel-title-sm"></span>
                        </h6>
                    </div>

                    <div className="d-flex justify-content-between align-items-stretch gap-0">
                        <div className="text-center w-100 py-3 d-flex flex-column">
                            <div className={`order-${flip ? 2 : 1}`}>
                                <span className="skel skel-subtext"></span>
                            </div>
                            <h1 className={`display-4 fw-bold order-${flip ? 1 : 2}`}>
                                <span className="skel skel-number"></span>
                            </h1>
                        </div>

                        <div className="border-start mx-3 admin-rate-separator opacity-75"></div>

                        <div className="text-center w-100 py-3 d-flex flex-column">
                            <div className={`order-${flip ? 2 : 1}`}>
                                <span className="skel skel-subtext"></span>
                            </div>
                            <h1 className={`display-4 fw-bold order-${flip ? 1 : 2}`}>
                                <span className="skel skel-number"></span>
                            </h1>
                        </div>
                    </div>
                </div>
            </div>
            <Shimmer theme="shimmer" />
        </div>
    );
};

export default CardRateSkeleton;
