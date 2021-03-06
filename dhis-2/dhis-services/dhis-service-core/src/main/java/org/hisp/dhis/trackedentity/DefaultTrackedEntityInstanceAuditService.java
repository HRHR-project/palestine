package org.hisp.dhis.trackedentity;

import java.util.Set;

import org.hisp.dhis.common.AuditType;
import org.hisp.dhis.common.IdentifiableObjectUtils;
import org.hisp.dhis.common.OrganisationUnitSelectionMode;
import org.hisp.dhis.organisationunit.OrganisationUnit;
import org.springframework.beans.factory.annotation.Autowired;

/*
 * Copyright (c) 2004-2016, University of Oslo
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 * Redistributions of source code must retain the above copyright notice, this
 * list of conditions and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice,
 * this list of conditions and the following disclaimer in the documentation
 * and/or other materials provided with the distribution.
 * Neither the name of the HISP project nor the names of its contributors may
 * be used to endorse or promote products derived from this software without
 * specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON
 * ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * @author Markus Bekken
 */
public class DefaultTrackedEntityInstanceAuditService implements TrackedEntityInstanceAuditService
{
    private static final boolean logRead = true;
    private static final boolean logUpdate = true;
    
    @Autowired
    private TrackedEntityInstanceAuditStore trackedEntityInstanceAuditStore;
    
    @Autowired
    private TrackedEntityInstanceService trackedEntityInstanceService;
	
    @Override
    public void logRead(TrackedEntityInstance trackedEntityInstance, String user, String auditMessage) 
    {
        if ( logRead )
        {
            addIfNotExisting( new TrackedEntityInstanceAudit( trackedEntityInstance, user, AuditType.READ, auditMessage ) );
        }
    }
    
    @Override
    public void logRead(TrackedEntityInstance trackedEntityInstance, String user, OrganisationUnitSelectionMode searchMode, Set<OrganisationUnit> organisationUnitList, String auditMessage) 
    {
        if ( logRead )
        {
            if ( searchMode != null )
            {
                auditMessage += " searchMode:" + searchMode.toString();
            }
            for ( String ou : IdentifiableObjectUtils.getUids( organisationUnitList ) )
            {
                auditMessage += " " + ou;
            }
            
             addIfNotExisting( new TrackedEntityInstanceAudit( trackedEntityInstance, user, AuditType.READ, auditMessage ) );
        }
    }

    @Override
    public void logUpdate( TrackedEntityInstance trackedEntityInstance, String user, String auditMessage )
    {
        if ( logUpdate ) 
        {
            addIfNotExisting( new TrackedEntityInstanceAudit( trackedEntityInstance, user, AuditType.UPDATE, auditMessage  ) );
        }
    }
    
    private void addIfNotExisting( TrackedEntityInstanceAudit trackedEntityInstanceAudit ) 
    {
        if ( !trackedEntityInstanceAuditStore.exists( trackedEntityInstanceAudit ) ) {
            int id = trackedEntityInstanceAuditStore.save( trackedEntityInstanceAudit );
        }
    }

    @Override
    public void logRead( String trackedEntityInstanceUid, String currentUsername, String message )
    {
        TrackedEntityInstance trackedEntityInstance = trackedEntityInstanceService.getTrackedEntityInstance( trackedEntityInstanceUid );
        logRead( trackedEntityInstance, currentUsername, message );
    }
}
