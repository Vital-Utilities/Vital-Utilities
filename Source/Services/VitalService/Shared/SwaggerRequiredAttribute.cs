using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;
using Swashbuckle.Swagger;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace VitalService
{
    [AttributeUsage(AttributeTargets.Property)]
    public class SwaggerRequiredAttribute : Attribute
    {
    }

    public class AddSwaggerRequiredSchemaFilter : Swashbuckle.AspNetCore.SwaggerGen.ISchemaFilter
    {
        public void Apply(OpenApiSchema schema, SchemaFilterContext context)
        {
            PropertyInfo[] properties = context.Type.GetProperties();
            foreach (PropertyInfo property in properties)
            {
                var attribute = property.GetCustomAttribute(typeof(SwaggerRequiredAttribute));

                if (attribute != null)
                {
                    var propertyNameInCamelCasing = char.ToLowerInvariant(property.Name[0]) + property.Name.Substring(1);

                    if (schema.Required == null)
                    {
                        schema.Required = new HashSet<string>()
                    {
                        propertyNameInCamelCasing
                    };
                    }
                    else
                    {
                        schema.Required.Add(propertyNameInCamelCasing);
                    }
                }
            }
        }
    }
}
