const Shimmer = ({theme = 'shimmer'}: {theme: string}) => {
    return (
        <div className="shimmer-wrapper">
            <div className={theme}></div>
        </div>
    );
}

export default Shimmer;