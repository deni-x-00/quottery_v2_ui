import React from "react";
import { Box, Divider, Link, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
import { getEventRules } from "./qubic/util/eventRules";

function EventRules({ event }) {
    const theme = useTheme();
    const rules = getEventRules(event);

    if (!rules) return null;

    return (
        <Box sx={{ mt: 2 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography
                variant="subtitle2"
                sx={{
                    fontWeight: 800,
                    color: theme.palette.primary.main,
                    mb: 1,
                }}
            >
                Rules
            </Typography>

            <Stack spacing={1.5}>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                    {rules.summary}
                </Typography>

                {rules.sections.map((section) => (
                    <Box
                        key={section.title}
                        sx={{
                            borderLeft: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                            pl: 1.5,
                        }}
                    >
                        <Typography
                            variant="caption"
                            sx={{
                                display: "block",
                                fontWeight: 800,
                                color: "text.primary",
                                textTransform: "uppercase",
                                letterSpacing: 0,
                                mb: 0.4,
                            }}
                        >
                            {section.title}
                        </Typography>

                        {section.lines.map((line) => (
                            <Typography
                                key={line}
                                variant="body2"
                                color="text.secondary"
                                sx={{ lineHeight: 1.55 }}
                            >
                                {line}
                            </Typography>
                        ))}

                        {(section.urls || (section.url ? [section.url] : [])).map((url) => (
                            <Link
                                key={url}
                                href={url}
                                target="_blank"
                                rel="noreferrer"
                                underline="hover"
                                variant="body2"
                                sx={{ display: "block", mt: 0.25, fontWeight: 700 }}
                            >
                                {url}
                            </Link>
                        ))}
                    </Box>
                ))}
            </Stack>
        </Box>
    );
}

export default EventRules;
