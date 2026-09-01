import React, { useEffect, useState } from 'react';
import { Route, Routes, BrowserRouter as Router } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import ScrollToTop from './components/ScrollToTop';
import LoadingScreen from './components/LoadingScreen';
import HomePage from './pages/HomePage';

const MIN_DISPLAY_MS = 500;
const MAX_WAIT_MS = 4000;

function App() {
    const [appReady, setAppReady] = useState(false);
    const [showLoader, setShowLoader] = useState(true);

    useEffect(() => {
        const start = Date.now();
        let finished = false;

        const finish = () => {
            if (finished) return;
            finished = true;
            const elapsed = Date.now() - start;
            const remaining = Math.max(0, MIN_DISPLAY_MS - elapsed);
            setTimeout(() => setAppReady(true), remaining);
        };

        if (document.readyState === 'complete') {
            finish();
        } else {
            window.addEventListener('load', finish);
        }
        const safety = setTimeout(finish, MAX_WAIT_MS);

        return () => {
            window.removeEventListener('load', finish);
            clearTimeout(safety);
        };
    }, []);

    return (
        <Router>
            <ScrollToTop />
            <AnimatePresence>
                {showLoader && <LoadingScreen ready={appReady} onFinish={() => setShowLoader(false)} />}
            </AnimatePresence>
            <Routes>
                <Route path="/" element={<HomePage />} />
            </Routes>
        </Router>
    );
}

export default App;
