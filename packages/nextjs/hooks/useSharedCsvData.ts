import { useEffect, useState } from "react";
import { type CsvTransaction } from "~~/services/store/csvStore";

interface SharedCsvData {
  data: CsvTransaction[];
  fileName: string;
  uploadedAt: string;
  metadata: {
    transactionCount: number;
    uploadedBy: string;
    version: string;
  };
}

export const useSharedCsvData = () => {
  const [data, setData] = useState<SharedCsvData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSharedData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch("/api/shared-csv-data");

        if (!response.ok) {
          if (response.status === 404) {
            setError("No shared CSV data available");
          } else {
            setError("Failed to fetch shared data");
          }
          return;
        }

        const result = await response.json();
        setData(result);
      } catch (err) {
        setError("Failed to fetch shared CSV data");
        console.error("Error fetching shared CSV data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();
  }, []);

  const refetch = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/shared-csv-data");

      if (!response.ok) {
        if (response.status === 404) {
          setError("No shared CSV data available");
        } else {
          setError("Failed to fetch shared data");
        }
        return;
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError("Failed to fetch shared CSV data");
      console.error("Error fetching shared CSV data:", err);
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    refetch,
    hasData: !!data,
    transactionCount: data?.metadata?.transactionCount || 0,
    fileName: data?.fileName,
    uploadedAt: data?.uploadedAt,
  };
};
