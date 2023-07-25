import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";

const useTime = () => {
    const [timestamp, setTimestamp] = useState<number | null>(null);

    const { isLoading, error, refetch } = useQuery(["time"], async () => {
        const latestDate = await axios.get("https://time-server-production.up.railway.app/");
        const initialTimestamp = latestDate?.data?.unix || Date.now();
        setTimestamp(initialTimestamp);
        return initialTimestamp;
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimestamp((prevTimestamp) => prevTimestamp + 1000);
        }, 1000);

        return () => {
            clearInterval(timer);
        };
    }, []);

    return { data: timestamp, isLoading, error, refetch };
};

export default useTime;