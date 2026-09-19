import Shimmer from "./Shimmer";

type CardBarChartSkeletonProps = {
    theme: 'light' | 'dark'
}

const CardBarChartSkeleton = ({ theme }: CardBarChartSkeletonProps) => {
    return (
        <div className="skeleton-wrapper">
            <div className={`h-100 card card-${theme}`}>
                <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-5">
                        <h5 className="card-title mb-0">
                            <span className="skel skel-title-lg"></span>
                        </h5>
                        <h6 className="card-title mb-0 d-none">
                            <span className="skel skel-title-sm"></span>
                        </h6>
                    </div>

                    <div className="d-flex justify-content-between align-items-center gap-5">
                        <div className="skeleton-vertical-bar"></div>

                        <div className="text-center w-100 mb-4 justify-content-start d-flex flex-column gap-2">

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-98"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-90"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-85"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-80"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-80"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-75"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-72"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-70"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-60"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-50"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-50"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-40"></span>
                            </div> 

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-30"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-30"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-30"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-20"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-20"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-10"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-10"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-5"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-5"></span>
                            </div>

                            <div className="d-flex flex-row gap-2">
                                <span className="skeleton-line bar-tile"></span>
                                <span className="skeleton-line bar-w-5"></span>
                            </div>

                        </div>

                    </div>

                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <div className="skeleton-horizontal-bar"></div>
                    </div>

                    <div className="d-flex justify-content-center align-items-center mt-4">
                        <div className="d-flex justify-content-start align-items-center gap-2">
                            <span className="skeleton-dot"></span>
                            <span className="skeleton-bar-md"></span>
                        </div>
                    </div>
                </div>
            </div>

            <Shimmer theme="shimmer" />
        </div>
    );
};

export default CardBarChartSkeleton;
