// import React, { memo, useMemo } from "react";
// import { DataGrid } from "@mui/x-data-grid";
// import { useTheme, Box, Typography, Fade } from "@mui/material";
// import LockIcon from "@mui/icons-material/Lock";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import HelpIcon from "@mui/icons-material/Help";
// import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
// import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
// import DiamondIcon from "@mui/icons-material/Diamond";
// import WhatshotIcon from "@mui/icons-material/Whatshot";
// import EggIcon from "@mui/icons-material/Egg";
// import { sumArray, formatQubicAmount, calculateTimeRemaining } from "./qubic/util";
// import LoadingSkeleton from "./qubic/ui/LoadingSkeleton";
// import gcLogo from "../assets/gc.png";
//
// const statusIcons = {
//   active: {
//     icon: CheckCircleIcon,
//     label: "Active",
//     color: "#4CAF50",
//     darkColor: "#70CF97",
//     sortValue: 4,
//   },
//   locked: {
//     icon: LockIcon,
//     label: "Locked",
//     color: "#E53935",
//     darkColor: "#FF6370",
//     sortValue: 3,
//   },
//   published: {
//     icon: EmojiEventsIcon,
//     label: "Published",
//     color: "#1565C0",
//     darkColor: "#61f0fe",
//     sortValue: 2,
//   },
//   waiting: {
//     icon: HelpIcon,
//     label: "Waiting",
//     color: "#FFB300",
//     darkColor: "#FFDE6B",
//     sortValue: 1,
//   },
//   historical: {
//     icon: EmojiEventsIcon,
//     label: "Historical",
//     color: "#9E9E9E",
//     darkColor: "#B0BEC5",
//     sortValue: 0,
//   },
// };
//
// const getPopularityLevel = (totalQus, slotsTaken) => {
//   if (totalQus >= 1_000_000_000 || slotsTaken >= 100) return 4;
//   if (totalQus >= 500_000_000 || slotsTaken >= 50) return 3;
//   if (totalQus >= 100_000_000 || slotsTaken >= 10) return 2;
//   if (totalQus >= 10_000_000 || slotsTaken >= 5) return 1;
//   return 0;
// };
//
// const getHotLevelIcon = (popularityLevel) => {
//   const darkModeColors = {
//     diamond: "#61f0fe",
//     fire: "#FF7043",
//     hot: "#FF5722",
//     warm: "#FFA726",
//     neutral: "#9E9E9E",
//   };
//
//   switch (popularityLevel) {
//     case 4:
//       return (
//         <DiamondIcon
//           sx={{ color: darkModeColors.diamond, fontSize: "1.2rem" }}
//         />
//       );
//     case 3:
//       return (
//         <LocalFireDepartmentIcon
//           sx={{ color: darkModeColors.fire, fontSize: "1.2rem" }}
//         />
//       );
//     case 2:
//       return (
//         <WhatshotIcon sx={{ color: darkModeColors.hot, fontSize: "1.2rem" }} />
//       );
//     case 1:
//       return (
//         <EggIcon sx={{ color: darkModeColors.warm, fontSize: "1.2rem" }} />
//       );
//     default:
//       return (
//         <EggIcon sx={{ color: darkModeColors.neutral, fontSize: "1.2rem" }} />
//       );
//   }
// };
//
// function EventOverviewTable({ events, onRowClick, loading }) {
//   const theme = useTheme();
//
//   const rows = useMemo(() => {
//     return events.map((event) => {
//       const popularityLevel = event.score;
//       const sData = statusIcons[0]; // active
//       const [closeDatePart, closeTimePart] = (event.closeDate || "").split(" ");
//       const rate0 = event.rate0 / 100000.0 * 100;
//       const rate1 = 100 - rate0;
//       return {
//         eid: event.eid,
//         status: {
//           value: sData?.sortValue || -1,
//           statusData: sData,
//           display: "Active",
//         },
//         description: event.desc,
//         expired: {
//           value: new Date(`${closeDatePart}T${closeTimePart}Z`).getTime(),
//           display: calculateTimeRemaining(closeDatePart, closeTimePart),
//         },
//         // eslint-disable-next-line no-useless-concat
//         Opt0: (event.option_desc?.[0] || event.option0Desc || "—") + "(" + `${rate0.toFixed(2)}` + "%)",
//         Opt1: (event.option_desc?.[1] || event.option1Desc || "—") + "(" + `${rate1.toFixed(2)}` + "%)",
//         total_qus: {
//           value: 111,
//           display: formatQubicAmount(111),
//         },
//         popularity: {
//           value: popularityLevel,
//           display: getHotLevelIcon(4),
//         },
//         volume24h: popularityLevel,
//       };
//     });
//   }, [events]);
//
//   const columns = [
//     {
//       field: "status",
//       headerName: "Topic",
//       width: 120,
//       sortable: false,
//       sortComparator: (v1, v2) => v1.value - v2.value,
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Topic
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//           height='100%'
//         >
//           <LoadingSkeleton width={40} height={16} />
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "description",
//       headerName: "Description",
//       width: 300,
//       sortable: false,
//       renderHeader: () => (
//         <Box display='flex' alignItems='center' gap={0.5}>
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Description
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box display='flex' alignItems='center' height='100%'>
//           <Typography
//             variant='body2'
//             sx={{
//               display: '-webkit-box',
//               WebkitLineClamp: 2,
//               WebkitBoxOrient: 'vertical',
//               overflow: 'hidden',
//               textOverflow: 'ellipsis',
//               lineHeight: 1.2,
//               maxHeight: '2.4em'
//             }}
//           >
//             {params.value}
//           </Typography>
//         </Box>
//       ),
//       headerAlign: "left",
//       align: "left",
//     },
//     {
//       field: "expired",
//       headerName: "Expired",
//       width: 120,
//       sortable: false,
//       sortComparator: (v1, v2) => v1.value - v2.value,
//       renderHeader: () => (
//         <Box display='flex' alignItems='center' gap={0.5}>
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Expired
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//         >
//           <Typography variant='body2'>{params.value.display}</Typography>
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "volume24h",
//       headerName: "24h Vol",
//       width: 100,
//       sortable: true,
//       type: "number",
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             24h Vol
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//           gap={0.5}
//         >
//           {loading ? (
//             <LoadingSkeleton width={60} height={16} />
//           ) : (
//             <>
//               <Typography variant='body2'>
//                 {typeof params.value === "number"
//                   ? formatQubicAmount(params.value)
//                   : "—"}
//               </Typography>
//               {typeof params.value === "number" && (
//                 <img
//                   src={gcLogo}
//                   alt='coin'
//                   width={25}
//                   height={25}
//                   style={{ marginLeft: 4, display: "block" }}
//                 />
//               )}
//             </>
//           )}
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "Opt0",
//       headerName: "Opt0",
//       width: 100,
//       sortable: false,
//       type: "string",
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Opt0
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//         >
//           <Typography variant='body2'>{params.value}</Typography>
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "Opt1",
//       headerName: "Opt1",
//       width: 100,
//       sortable: false,
//       type: "string",
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Opt1
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//         >
//           <Typography variant='body2'>{params.value}</Typography>
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "total_qus",
//       headerName: "Open Interest",
//       width: 130,
//       sortable: true,
//       sortComparator: (v1, v2) => v1.value - v2.value,
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Open Interest
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//           gap={0.5}
//         >
//           <LoadingSkeleton width={80} height={16} />
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//     {
//       field: "popularity",
//       headerName: "Hot",
//       width: 150,
//       sortable: true,
//       sortComparator: (v1, v2) => v2.value - v1.value,
//       renderHeader: () => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           gap={0.5}
//         >
//           <Typography variant='subtitle2' fontWeight='bold'>
//             Hot
//           </Typography>
//         </Box>
//       ),
//       renderCell: (params) => (
//         <Box
//           display='flex'
//           alignItems='center'
//           justifyContent='center'
//           height='100%'
//         >
//           <LoadingSkeleton width={50} height={16} />
//         </Box>
//       ),
//       headerAlign: "center",
//       align: "center",
//     },
//   ];
//
//   return (
//     <Fade in={true} timeout={600}>
//       <Box
//         sx={{
//           width: "100%",
//           background: theme.palette.background.paper,
//           borderRadius: 1,
//           "& .MuiDataGrid-row:hover": {
//             backgroundColor: theme.palette.background.paper,
//             cursor: "pointer",
//           },
//           "& .MuiDataGrid-cell": {
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//           },
//           "& .MuiDataGrid-columnHeaders": {
//             backgroundColor: theme.palette.background.default,
//           },
//         }}
//       >
//         <DataGrid
//           rows={rows}
//           columns={columns}
//           disableRowSelectionOnClick
//           autoHeight
//           loading={loading}
//           initialState={{
//             pagination: {
//               pageSize: 10,
//             },
//           }}
//           paginationMode='client'
//           pageSizeOptions={[10, 25, 50, 100]}
//           getRowId={(row) => row.eid}
//           onRowClick={(params) => onRowClick(params.row.eid)}
//         />
//       </Box>
//     </Fade>
//   );
// }
//
// export default memo(EventOverviewTable);
