import { useState } from 'react';

/**
 * Custom hook for managing domain analysis API calls
 */
export const useAnalysis = (humbleworthToken, atomCredentials) => {
    const [analysisResults, setAnalysisResults] = useState({});
    const [analyzingDomains, setAnalyzingDomains] = useState({});
    const [isSuperValuating, setIsSuperValuating] = useState(false);

    const handleAnalyseDomain = async (domain) => {
        if (analyzingDomains[domain]) return;

        setAnalyzingDomains(prev => ({ ...prev, [domain]: true }));

        const tokenToSend = humbleworthToken || undefined;

        try {
            // 1. Start Prediction
            const response = await fetch('/api/replicate/predictions', {
                method: "POST",
                headers: {
                    "Authorization": tokenToSend ? "Bearer " + tokenToSend : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: "a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                    input: { domains: domain }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Start API failed: ${response.status} ${errorText}`);
            }

            const prediction = await response.json();
            const predictionId = prediction.id;

            // 2. Poll for Results
            const pollUrl = `/api/replicate/predictions/${predictionId}`;

            let result = prediction;
            while (result.status !== "succeeded" && result.status !== "failed" && result.status !== "canceled") {
                await new Promise(r => setTimeout(r, 1500)); // Wait 1.5s

                const pollResponse = await fetch(pollUrl, {
                    headers: {
                        "Authorization": tokenToSend ? "Bearer " + tokenToSend : undefined,
                    }
                });

                if (!pollResponse.ok) {
                    const errorText = await pollResponse.text();
                    throw new Error(`Poll API failed: ${pollResponse.status} ${errorText}`);
                }

                result = await pollResponse.json();
            }

            if (result.status === "succeeded" && result.output && result.output.valuations && result.output.valuations.length > 0) {
                setAnalysisResults(prev => ({
                    ...prev,
                    [domain]: result.output.valuations[0]
                }));
            } else if (result.status === "failed") {
                throw new Error("Prediction failed on server side.");
            }

        } catch (error) {
            console.error("Analysis failed:", error);
            alert(`Analysis failed: ${error.message}`);
        } finally {
            setAnalyzingDomains(prev => ({ ...prev, [domain]: false }));
        }
    };

    const handleAnalyseAtom = async (domain) => {
        if (analyzingDomains[domain]) return;

        if (!atomCredentials.api_token || !atomCredentials.user_id) {
            alert("Please configure your Atom API Token and User ID in the settings (gear icon).");
            return;
        }

        setAnalyzingDomains(prev => ({ ...prev, [domain]: true }));

        try {
            const response = await fetch(`/api/atom/atom-appraisal?domain=${domain}&api_token=${atomCredentials.api_token}&user_id=${atomCredentials.user_id}`);

            if (!response.ok) {
                const text = await response.text();
                throw new Error(`Atom API failed: ${text}`);
            }

            const data = await response.json();

            setAnalysisResults(prev => ({
                ...prev,
                [domain]: { ...prev[domain], atom: data }
            }));

        } catch (error) {
            console.error("Atom Analysis failed:", error);
            alert(`Atom Analysis failed: ${error.message}`);
        } finally {
            setAnalyzingDomains(prev => ({ ...prev, [domain]: false }));
        }
    };

    const handleSuperValuation = async (paginatedDomains) => {
        if (paginatedDomains.length === 0) return;

        setIsSuperValuating(true);

        const domainsToAnalyze = paginatedDomains;
        const domainsString = domainsToAnalyze.map(d => d.toLowerCase()).join(',');

        // Set analyzing state for all
        const newAnalyzingState = { ...analyzingDomains };
        domainsToAnalyze.forEach(d => newAnalyzingState[d] = true);
        setAnalyzingDomains(newAnalyzingState);

        const tokenToSend = humbleworthToken || undefined;

        try {
            // 1. Start Prediction
            const response = await fetch('/api/replicate/predictions', {
                method: "POST",
                headers: {
                    "Authorization": tokenToSend ? "Bearer " + tokenToSend : "",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    version: "a925db842c707850e4ca7b7e86b217692b0353a9ca05eb028802c4a85db93843",
                    input: { domains: domainsString }
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Start API failed: ${response.status} ${errorText}`);
            }

            const prediction = await response.json();
            const predictionId = prediction.id;

            // 2. Poll for Results
            const pollUrl = `/api/replicate/predictions/${predictionId}`;
            let result = prediction;

            while (result.status !== "succeeded" && result.status !== "failed" && result.status !== "canceled") {
                await new Promise(r => setTimeout(r, 1500));

                const pollResponse = await fetch(pollUrl, {
                    headers: {
                        "Authorization": tokenToSend ? "Bearer " + tokenToSend : undefined,
                    }
                });

                if (!pollResponse.ok) {
                    const errorText = await pollResponse.text();
                    throw new Error(`Poll API failed: ${pollResponse.status} ${errorText}`);
                }

                result = await pollResponse.json();
            }

            if (result.status === "succeeded" && result.output && result.output.valuations) {
                setAnalysisResults(prev => {
                    const next = { ...prev };

                    const lowercaseToOriginal = {};
                    domainsToAnalyze.forEach(d => lowercaseToOriginal[d.toLowerCase()] = d);

                    result.output.valuations.forEach(val => {
                        const returnedDomain = val.domain.toLowerCase();
                        const originalDomainKey = lowercaseToOriginal[returnedDomain];

                        if (originalDomainKey) {
                            next[originalDomainKey] = val;
                        }
                    });
                    return next;
                });
            } else if (result.status === "failed") {
                throw new Error("Batch prediction failed on server side.");
            }

        } catch (error) {
            console.error("Super Valuation failed:", error);
            alert(`Super Valuation failed: ${error.message}`);
        } finally {
            // Reset analyzing state
            setAnalyzingDomains(prev => {
                const next = { ...prev };
                domainsToAnalyze.forEach(d => next[d] = false);
                return next;
            });
            setIsSuperValuating(false);
        }
    };

    return {
        analysisResults,
        setAnalysisResults,
        analyzingDomains,
        handleAnalyseDomain,
        handleAnalyseAtom,
        handleSuperValuation,
        isSuperValuating
    };
};
