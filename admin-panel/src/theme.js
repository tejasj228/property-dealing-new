import { createTheme } from '@mui/material/styles';
import KeyboardArrowDownRounded from '@mui/icons-material/KeyboardArrowDownRounded';

const colors = { background:'#151513', paper:'#22221e', raised:'#2b2a24', ink:'#f2eee3', muted:'#bcb6a5', accent:'#e4ba45', line:'#414037' };
export default createTheme({
  palette: {
    mode:'dark',
    primary:{ main:colors.accent, light:'#f2d67e', dark:'#bd901f', contrastText:'#26200e' },
    secondary:{ main:'#bfb7a4', contrastText:'#26200e' },
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

    MuiSelect:{ defaultProps:{ IconComponent:KeyboardArrowDownRounded, MenuProps:{ disableScrollLock:true, marginThreshold:12, transitionDuration:140, slotProps:{paper:{sx:{maxHeight:320,mt:.75,p:.5,border:'1px solid #605a49',borderRadius:2,boxShadow:'0 14px 35px #0d0c0966'}}} } }, styleOverrides:{ select:{'&:focus':{backgroundColor:'#3c382e'}}, icon:{transition:'transform .18s ease'}, iconOpen:{transform:'rotate(180deg)'} } },
    MuiMenuItem:{ styleOverrides:{ root:{ minHeight:42,borderRadius:6,margin:'2px 0',fontSize:13,transition:'background-color .16s ease,color .16s ease','&:hover,&.Mui-focusVisible':{backgroundColor:'#4d483a'},'&.Mui-selected':{backgroundColor:'#423d31',color:'#e5e1d7',fontWeight:650},'&.Mui-selected:hover':{backgroundColor:'#544e3f'} } } },
    MuiMenu:{ styleOverrides:{ paper:{border:'1px solid #605a49',borderRadius:12,backgroundColor:'#322f26'},list:{padding:6} } },

    MuiButtonBase:{ defaultProps:{ disableRipple:true } },
    MuiButton:{ defaultProps:{ disableElevation:true }, styleOverrides:{ root:{ borderRadius:8, minHeight:40, paddingInline:17, whiteSpace:'nowrap', '& .MuiButton-icon>*:nth-of-type(1)':{ fontSize:22 } }, sizeLarge:{ minHeight:44, fontSize:13 }, text:{ '&:hover':{ color:'#efece6', backgroundColor:'#423e32' } }, outlined:{ '&:hover':{ color:'#efece6', borderColor:'#efece6' } } } },
    MuiPaper:{ defaultProps:{ elevation:0 }, styleOverrides:{ root:{ backgroundImage:'none' }, outlined:{ borderColor:colors.line } } },
    MuiCard:{ styleOverrides:{ root:{ border:`1px solid ${colors.line}`, boxShadow:'none', borderRadius:12 } } },
    MuiCardContent:{ styleOverrides:{ root:{ padding:22, '&:last-child':{ paddingBottom:22 } } } },
    MuiTextField:{ defaultProps:{ size:'small', variant:'outlined' } }, MuiFormControl:{ defaultProps:{ size:'small' } },
    MuiOutlinedInput:{ styleOverrides:{ root:{ background:'#26231c', borderRadius:8, fontSize:13 }, notchedOutline:{ borderColor:'#605a49' } } },
    MuiInputLabel:{ styleOverrides:{ root:{ fontSize:13 } } },
    MuiChip:{ styleOverrides:{ root:{ fontWeight:600, fontSize:11, height:26 }, colorPrimary:{ backgroundColor:'#423d31', color:'#e0dcd1' }, colorSecondary:{ backgroundColor:'#433e32', color:'#d5cfc0' } } },
    MuiTooltip:{ defaultProps:{ arrow:true }, styleOverrides:{ tooltip:{ backgroundColor:'#e6e2d9', color:'#26200e', fontSize:11 }, arrow:{ color:'#e6e2d9' } } },
    MuiIconButton:{ styleOverrides:{ root:{ borderRadius:8, minWidth:40, minHeight:40, '&:hover':{ color:'#efece6', backgroundColor:'#423e32' }, '&:focus-visible':{ outline:`2px solid ${colors.accent}`, outlineOffset:3 } } } },
    MuiTabs:{ defaultProps:{ variant:'scrollable', scrollButtons:'auto' }, styleOverrides:{ root:{ minHeight:46 }, indicator:{ height:3, borderRadius:3 } } },
    MuiTab:{ styleOverrides:{ root:{ textTransform:'none', minHeight:46, fontSize:12, fontWeight:600 } } },
    MuiDialog:{ defaultProps:{ transitionDuration:140 }, styleOverrides:{ paper:{ borderRadius:14, boxShadow:'0 24px 80px #0d0c0980', border:`1px solid ${colors.line}` } } },
    MuiDialogTitle:{ styleOverrides:{ root:{ padding:'24px 26px 18px', borderBottom:`1px solid ${colors.line}`, fontSize:20, letterSpacing:'-.035em' } } },
    MuiDialogContent:{ styleOverrides:{ root:{ padding:'24px 26px', '&.MuiDialogContent-root':{ paddingTop:24 } } } },
    MuiDialogActions:{ styleOverrides:{ root:{ padding:'16px 26px', borderTop:`1px solid ${colors.line}`, gap:8 } } },
    MuiAlert:{ styleOverrides:{ root:{ borderRadius:8, fontSize:13, alignItems:'center' } } },
    MuiTableCell:{ styleOverrides:{ root:{ borderColor:colors.line, padding:'14px 18px' }, head:{ backgroundColor:'#26241d', color:colors.muted, fontSize:11, fontWeight:600 } } },
    MuiAccordion:{ defaultProps:{ disableGutters:true }, styleOverrides:{ root:{ border:`1px solid ${colors.line}`, boxShadow:'none', '&:before':{ display:'none' } } } },
    MuiAvatar:{ styleOverrides:{ colorDefault:{ background:'#474236', color:colors.ink } } },
    MuiCssBaseline:{ styleOverrides:{ body:{ backgroundColor:colors.background, colorScheme:'dark' }, '*:focus-visible':{ outline:`2px solid ${colors.accent}`, outlineOffset:3 } } },
  },
});
