import Shimmer from "./Shimmer";

type CardPieChartSkeletonProps = {
    theme: 'light' | 'dark',
    hideFilter?: boolean,
}

const CardPieChartSkeleton = ({ theme, hideFilter }: CardPieChartSkeletonProps) => {
    return (
        <div className="skeleton-wrapper">
            <div className={`h-100 card card-${theme}`}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h5 className="card-title mb-0">
                            <span className="skel skel-title-lg"></span>
                        </h5>
                        {!hideFilter && <h6 className="card-title mb-0">
                            <span className="skel skel-title-sm"></span>
                        </h6>}
                    </div>

                    <div className="d-flex justify-content-around align-items-stretch gap-3 gap-sm-5">
                        <div className="w-100 py-3 justify-content-center d-flex">
                            <div className="skeleton-circle-lg"></div>
                        </div>

                        <div className="text-center w-100 py-3 mt-2 justify-content-start d-flex flex-column gap-2">
                            <div className="d-flex justify-content-start align-items-center gap-2">
                                <span className="skeleton-dot"></span>
                                <span className="skeleton-bar-sm"></span>
                            </div>

                            <div className="d-flex justify-content-start align-items-center gap-2">
                                <span className="skeleton-dot-alt"></span>
                                <span className="skeleton-bar-md"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Shimmer theme="shimmer" />
        </div>
    );
};

export default CardPieChartSkeleton;
