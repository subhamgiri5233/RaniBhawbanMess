import { useLocation } from 'react-router-dom';

const AnimatedRoutes = ({ children }) => {
    const location = useLocation();

    return (
        <div
            key={location.pathname}
            style={{ width: '100%', height: '100%', position: 'relative' }}
        >
            {children}
        </div>
    );
};

export default AnimatedRoutes;
