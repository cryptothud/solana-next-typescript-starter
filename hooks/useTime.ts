import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { timestampState } from "../scripts/atoms";

const useTime = () => {
    const [timestamp, setTimestamp] = useRecoilState<number | null>(timestampState);

    const { isLoading, error, refetch } = useQuery(["current-time"], async () => {
        setTimestamp(null)
        const latestDate = await axios.get("https://time-server-production.up.railway.app/");
        const initialTimestamp = latestDate?.data?.unix || Date.now();
        setTimestamp(initialTimestamp);
        return initialTimestamp;
    }, {
        enabled: true,
        retry: false,
        refetchOnMount: true,
        refetchOnWindowFocus: true,
        refetchOnReconnect: true
    });

    useEffect(() => {
        if (timestamp === null) {
            const timer = setInterval(() => {
                setTimestamp((prevTimestamp) => prevTimestamp + 1000);
            }, 1000);

            return () => {
                clearInterval(timer);
            };
        }
    }, []);

    return { data: timestamp, isLoading, error, refetch };
};

export default useTime;