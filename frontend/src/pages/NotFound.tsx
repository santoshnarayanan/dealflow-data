import { Link } from "react-router-dom";

function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center text-center py-20">
            <h1 className="text-6xl font-bold text-gray-800 mb-4">404</h1>
            <p className="text-lg text-gray-600 mb-6">
                Oops! The page you’re looking for doesn’t exist.
            </p>
            <Link
                to="/"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
                Go Home
            </Link>
        </div>
    );
}

export default NotFound;
