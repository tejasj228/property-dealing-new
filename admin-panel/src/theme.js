import { createTheme } from '@mui/material/styles';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';

const colors = { background:'#12231e', paper:'#1c3027', raised:'#23392e', ink:'#e3eee5', muted:'#abc1b2', accent:'#b2d4b8', line:'#375044' };
export default createTheme({
  palette: {
    mode:'dark',
    primary:{ main:colors.accent, light:'#d0e8d4', dark:'#86b99a', contrastText:'#172e22' },
    secondary:{ main:'#a4bfb0', contrastText:'#172e22' },
    background:{ default:colors.background, paper:colors.paper },
    text:{ primary:colors.ink, secondary:colors.muted }, divider:colors.line,
    success:{ main:'#8bc9a6' }, info:{ main:'#98c5d4' }, warning:{ main:'#e2b77c' }, error:{ main:'#ecaaa0' },
  },
  typography:{
    fontFamily:'Manrope, "Segoe UI", sans-serif', fontSize:13,
    h4:{ fontSize:'1.85rem', fontWeight:600, letterSpacing:'-.055em', lineHeight:1.2 },
    h5:{ fontSize:'1.4rem', fontWeight:600, letterSpacing:'-.035em' },
    h6:{ fontSize:'1rem', fontWeight:600, letterSpacing:'-.02em' },
    subtitle1:{ fontWeight:600 }, button:{ textTransform:'none', fontWeight:600, letterSpacing:0 }, body2:{ lineHeight:1.65 },
  },
  shape:{ borderRadius:10 }, transitions:{ duration:{ shortest:120, shorter:150, short:180, standard:200 } },
  components:{
    MuiSvgIcon:{ styleOverrides:{ fontSizeSmall:{ fontSize:22 }, fontSizeMedium:{ fontSize:24 }, fontSizeLarge:{ fontSize:32 } } },

    MuiSelect:{ defaultProps:{ IconComponent:KeyboardArrowDownRounded, MenuProps:{ disableScrollLock:true, marginThreshold:12, transitionDuration:140, slotProps:{paper:{sx:{maxHeight:320,mt:.75,p:.5,border:'1px solid #476252',borderRadius:2,boxShadow:'0 14px 35px #06100c66'}}} } }, styleOverrides:{ select:{'&:focus':{backgroundColor:'#274333'}}, icon:{transition:'transform .18s ease'}, iconOpen:{transform:'rotate(180deg)'} } },
    MuiMenuItem:{ styleOverrides:{ root:{ minHeight:42,borderRadius:6,margin:'2px 0',fontSize:13,transition:'background-color .16s ease,color .16s ease','&:hover,&.Mui-focusVisible':{backgroundColor:'#335440'},'&.Mui-selected':{backgroundColor:'#2a4936',color:'#d2ead8',fontWeight:650},'&.Mui-selected:hover':{backgroundColor:'#375c43'} } } },
    MuiMenu:{ styleOverrides:{ paper:{border:'1px solid #476252',borderRadius:12,backgroundColor:'#20382b'},list:{padding:6} } },

    MuiButtonBase:{ defaultProps:{ disableRipple:true } },
    MuiButton:{ defaultProps:{ disableElevation:true }, styleOverrides:{ root:{ borderRadius:8, minHeight:40, paddingInline:17, whiteSpace:'nowrap', '& .MuiButton-icon>*:nth-of-type(1)':{ fontSize:22 } }, sizeLarge:{ minHeight:44, fontSize:13 }, text:{ '&:hover':{ color:'#e3f2e5', backgroundColor:'#2b4938' } }, outlined:{ '&:hover':{ color:'#e3f2e5', borderColor:'#e3f2e5' } } } },
    MuiPaper:{ defaultProps:{ elevation:0 }, styleOverrides:{ root:{ backgroundImage:'none' }, outlined:{ borderColor:colors.line } } },
    MuiCard:{ styleOverrides:{ root:{ border:`1px solid ${colors.line}`, boxShadow:'none', borderRadius:12 } } },
    MuiCardContent:{ styleOverrides:{ root:{ padding:22, '&:last-child':{ paddingBottom:22 } } } },
    MuiTextField:{ defaultProps:{ size:'small', variant:'outlined' } }, MuiFormControl:{ defaultProps:{ size:'small' } },
    MuiOutlinedInput:{ styleOverrides:{ root:{ background:'#172b22', borderRadius:8, fontSize:13 }, notchedOutline:{ borderColor:'#476252' } } },
    MuiInputLabel:{ styleOverrides:{ root:{ fontSize:13 } } },
    MuiChip:{ styleOverrides:{ root:{ fontWeight:600, fontSize:11, height:26 }, colorPrimary:{ backgroundColor:'#2a4936', color:'#cae7d0' }, colorSecondary:{ backgroundColor:'#30453c', color:'#bfd6c7' } } },
    MuiTooltip:{ defaultProps:{ arrow:true }, styleOverrides:{ tooltip:{ backgroundColor:'#d7e8dc', color:'#172e22', fontSize:11 }, arrow:{ color:'#d7e8dc' } } },
    MuiIconButton:{ styleOverrides:{ root:{ borderRadius:8, minWidth:40, minHeight:40, '&:hover':{ color:'#e3f2e5', backgroundColor:'#2b4938' }, '&:focus-visible':{ outline:`2px solid ${colors.accent}`, outlineOffset:3 } } } },
    MuiTabs:{ defaultProps:{ variant:'scrollable', scrollButtons:'auto' }, styleOverrides:{ root:{ minHeight:46 }, indicator:{ height:3, borderRadius:3 } } },
    MuiTab:{ styleOverrides:{ root:{ textTransform:'none', minHeight:46, fontSize:12, fontWeight:600 } } },
    MuiDialog:{ defaultProps:{ transitionDuration:140 }, styleOverrides:{ paper:{ borderRadius:14, boxShadow:'0 24px 80px #06100c80', border:`1px solid ${colors.line}` } } },
    MuiDialogTitle:{ styleOverrides:{ root:{ padding:'24px 26px 18px', borderBottom:`1px solid ${colors.line}`, fontSize:20, letterSpacing:'-.035em' } } },
    MuiDialogContent:{ styleOverrides:{ root:{ padding:'24px 26px', '&.MuiDialogContent-root':{ paddingTop:24 } } } },
    MuiDialogActions:{ styleOverrides:{ root:{ padding:'16px 26px', borderTop:`1px solid ${colors.line}`, gap:8 } } },
    MuiAlert:{ styleOverrides:{ root:{ borderRadius:8, fontSize:13, alignItems:'center' } } },
    MuiTableCell:{ styleOverrides:{ root:{ borderColor:colors.line, padding:'14px 18px' }, head:{ backgroundColor:'#182b22', color:colors.muted, fontSize:11, fontWeight:600 } } },
    MuiAccordion:{ defaultProps:{ disableGutters:true }, styleOverrides:{ root:{ border:`1px solid ${colors.line}`, boxShadow:'none', '&:before':{ display:'none' } } } },
    MuiAvatar:{ styleOverrides:{ colorDefault:{ background:'#304d3c', color:colors.ink } } },
    MuiCssBaseline:{ styleOverrides:{ body:{ backgroundColor:colors.background, colorScheme:'dark' }, '*:focus-visible':{ outline:`2px solid ${colors.accent}`, outlineOffset:3 } } },
  },
});
