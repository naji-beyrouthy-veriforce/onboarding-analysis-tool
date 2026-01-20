"""
Timezone conversion helper for legacy script compatibility.
Currently a stub implementation since timezone handling is not actively used.
"""

def convertFromIANATimezone(tz_string):
    """
    Convert IANA timezone to Windows format.
    Returns the input as-is for now since timezone conversion is not implemented.
    
    Args:
        tz_string: IANA timezone string
        
    Returns:
        str: The input string unchanged
    """
    return str(tz_string) if tz_string else ""


