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

    const getAuthUrl = async () => {
        try {
          const response = await axios.get(`http://localhost:3000/login?id=${id}`);
          window.location.href = response.data.url;
        } catch (error) {
          console.error('Error fetching auth URL', error);
        }
      };

    useEffect(() => {
        const fetchEvent = async () => {
            try {
                const response = await axios.get(`http://localhost:3000/api/events/${id}`);
                setEvent(response.data);
                setLoading(false);
            } catch (err) {
                setLoading(false);
                setError('Event not found');
                navigate('/404'); // Replace with 404
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
        <div className="title">CalConnect</div>
        <div className="container">
            <button type="button" onClick={getAuthUrl}>Add Calendar</button>
        </div>
    </div>
    );
};

export default Meet;
