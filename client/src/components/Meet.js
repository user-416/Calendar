import React, {useEffect, useState} from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate } from 'react-router-dom';
import './Main.css';

const Meet = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/events/` + id);
                setEvent(response.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Event not found');
                navigate('/'); // Replace with 404
            }
        };
    
        fetchEvent();
    }, [id, navigate]);
    
    if (loading) {
        return <div>Loading...</div>;
    }
    
    if (error) {
        return <div>{error}</div>;
    }

    return (
    <div>
        <div class="title">CalConnect</div>
        <div class="container">
            <p>Please log in to access your calendars and events.</p>
            <Link to="/login">Login</Link>
        </div>
    </div>
    );
};

export default Meet;
